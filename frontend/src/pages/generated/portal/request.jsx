// Native React page. Data contract: portal/request.
import {
  Fragment,
  cssStyle,
  text,
  Field,
  ActionForm,
  CsrfField,
} from "@ui/runtime";
export default function Page({ data, state }) {
  return (
    <>
      {"\n"}
      <a className={"small"} href={"/portal/requests/"}>
        {"‹ Service requests"}
      </a>
      {"\n"}
      <div className={"spread mt-s mb"}>
        <div>
          <h1>{data.v1}</h1>
          <div className={"muted small"}>
            {data.v2}
            {data.choice3 === 0 ? (
              <>
                {" · "}
                {data.v4} <span className={"mono"}>{data.v5}</span>
              </>
            ) : null}
          </div>
        </div>
        <span className={"badge " + text(data.v6)}>{data.v7}</span>
      </div>
      {"\n\n"}
      {data.choice8 === 0 ? (
        <>
          <div className={"banner ok"}>
            <span className={"ico"}>{"✓"}</span>
            <div>
              <div className={"big"}>{"Covered by warranty"}</div>
              <div className={"small"}>{data.v9}</div>
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice8 === 1 ? (
        <>
          <div className={"banner warn"}>
            <span className={"ico"}>{"!"}</span>
            <div>
              <div className={"big"}>{"Not covered by warranty"}</div>
              <div className={"small"}>{data.v10}</div>
            </div>
          </div>
          {"\n"}
        </>
      ) : data.choice8 === 2 ? (
        <>
          <div className={"banner info"}>
            <span className={"ico"}>{"i"}</span>
            <div className={"small"}>{data.v11}</div>
          </div>
        </>
      ) : null}
      {"\n\n"}
      <div className={"stack mt"}>
        {"\n  "}
        {data.choice12 === 0 ? (
          <>
            {"\n  "}
            <div className={"next"}>
              <div className={"lbl"}>{"Please confirm"}</div>
              {"\n    "}
              <p style={cssStyle("margin:.3rem 0 .7rem;font-weight:600")}>
                {"The technician says this is fixed. Is everything working?"}
              </p>
              {"\n    "}
              <ActionForm
                method={"post"}
                action={"/portal/requests/" + text(data.v13) + "/confirm/"}
                className={"stack"}
              >
                <CsrfField />
                {"\n      "}
                <div style={cssStyle("margin-bottom:.5rem")}>
                  {"\n        "}
                  <label
                    className={"small muted"}
                    style={cssStyle("display:block;margin-bottom:4px")}
                  >
                    {"How was the technician's service?"}
                  </label>
                  {"\n        "}
                  <div
                    className={"row"}
                    style={cssStyle("gap:.6rem;flex-wrap:wrap")}
                  >
                    {"\n          "}
                    <label
                      style={cssStyle(
                        "cursor:pointer;font-size:0.95rem;background:var(--bg);padding:4px 8px;border-radius:4px;border:1px solid var(--line)",
                      )}
                    >
                      <Field
                        type={"radio"}
                        name={"rating"}
                        value={"5"}
                        checked={true}
                      />
                      {" ⭐ 5 Excellent"}
                    </label>
                    {"\n          "}
                    <label
                      style={cssStyle(
                        "cursor:pointer;font-size:0.95rem;background:var(--bg);padding:4px 8px;border-radius:4px;border:1px solid var(--line)",
                      )}
                    >
                      <Field type={"radio"} name={"rating"} value={"4"} />
                      {" ⭐ 4 Good"}
                    </label>
                    {"\n          "}
                    <label
                      style={cssStyle(
                        "cursor:pointer;font-size:0.95rem;background:var(--bg);padding:4px 8px;border-radius:4px;border:1px solid var(--line)",
                      )}
                    >
                      <Field type={"radio"} name={"rating"} value={"3"} />
                      {" ⭐ 3 Average"}
                    </label>
                    {"\n          "}
                    <label
                      style={cssStyle(
                        "cursor:pointer;font-size:0.95rem;background:var(--bg);padding:4px 8px;border-radius:4px;border:1px solid var(--line)",
                      )}
                    >
                      <Field type={"radio"} name={"rating"} value={"2"} />
                      {" ⭐ 2 Poor"}
                    </label>
                    {"\n          "}
                    <label
                      style={cssStyle(
                        "cursor:pointer;font-size:0.95rem;background:var(--bg);padding:4px 8px;border-radius:4px;border:1px solid var(--line)",
                      )}
                    >
                      <Field type={"radio"} name={"rating"} value={"1"} />
                      {" ⭐ 1 Bad"}
                    </label>
                    {"\n        "}
                  </div>
                  {"\n      "}
                </div>
                {"\n      "}
                <Field
                  className={"inp"}
                  name={"note"}
                  placeholder={"Optional comments or feedback"}
                />
                {"\n      "}
                <div className={"row"}>
                  <button
                    className={"btn btn-ok btn-lg grow"}
                    name={"works"}
                    value={"1"}
                  >
                    {"Yes, it works"}
                  </button>
                  <button
                    className={"btn btn-danger btn-lg grow"}
                    name={"works"}
                    value={"0"}
                  >
                    {"Still not working"}
                  </button>
                </div>
                {"\n    "}
              </ActionForm>
            </div>
            {"\n  "}
          </>
        ) : data.choice12 === 1 ? (
          <>
            {"\n    "}
            <div className={"banner ok"}>
              <span className={"ico"}>{"✓"}</span>
              <div>
                {"\n      "}
                <div className={"big"}>
                  {"Closed. Thank you for confirming."}
                </div>
                {"\n      "}
                {data.choice14 === 0 ? (
                  <>
                    <div className={"small mt-xs"}>
                      {"Your rating: "}
                      <b style={cssStyle("color:#d97706")}>
                        {"⭐ "}
                        {data.v15}
                        {" / 5 stars"}
                      </b>
                    </div>
                  </>
                ) : null}
                {"\n    "}
              </div>
            </div>
            {"\n  "}
          </>
        ) : null}
        {"\n\n  "}
        {data.choice16 === 0 ? (
          <>
            <div className={"pcard"}>
              <h3>
                {"Service invoice "}
                {data.v17}
              </h3>
              <p className={"small muted mt-s"}>
                {"Parts and labour for this repair."}
              </p>
              {"\n    "}
              <div className={"spread mt-s"}>
                <span className={"bold"} style={cssStyle("font-size:1.3rem")}>
                  {data.v18}
                </span>
                <span className={"badge " + text(data.v19)}>{data.v20}</span>
              </div>
              {"\n    "}
              <div className={"row mt-s"}>
                {data.choice21 === 0 ? (
                  <>
                    <a
                      className={"btn btn-primary"}
                      href={
                        "/portal/p/" +
                        text(data.v22) +
                        "/pay/?invoice=" +
                        text(data.v23)
                      }
                    >
                      {"Pay "}
                      {data.v24}
                    </a>
                  </>
                ) : null}
                <a
                  className={"btn btn-line"}
                  href={"/doc/invoice/" + text(data.v25) + "/"}
                >
                  {"View invoice"}
                </a>
              </div>
            </div>
          </>
        ) : null}
        {"\n\n  "}
        <div className={"pcard"}>
          <h3 className={"mb-s"}>{"Details"}</h3>
          {"\n    "}
          <dl className={"kv small"}>
            {"\n      "}
            {data.choice26 === 0 ? (
              <>
                <dt>{"Fault code"}</dt>
                <dd>{data.v27}</dd>
              </>
            ) : null}
            {"\n      "}
            <dt>{"Problem"}</dt>
            <dd>{data.v28}</dd>
            {"\n      "}
            {data.choice29 === 0 ? (
              <>
                <dt>{"Technician"}</dt>
                <dd>
                  {data.v30}
                  {data.choice31 === 0 ? (
                    <>
                      {" · "}
                      <a href={"tel:" + text(data.v32)}>{data.v33}</a>
                    </>
                  ) : null}
                </dd>
              </>
            ) : null}
            {"\n      "}
            {data.choice34 === 0 ? (
              <>
                <dt>{"Visit"}</dt>
                <dd>{data.v35}</dd>
              </>
            ) : null}
            {"\n    "}
          </dl>
        </div>
        {"\n  "}
        <div className={"pcard"}>
          <h3 className={"mb-s"}>{"Updates"}</h3>
          <ul className={"tl"}>
            {data.rows36?.length ? (
              data.rows36.map((row36, index) => (
                <Fragment key={index}>
                  <li>
                    <span className={"when"}>{row36.v37}</span>
                    <span className={"what"}>{row36.v38}</span>
                  </li>
                </Fragment>
              ))
            ) : (
              <>
                <li className={"muted"}>{"No updates yet."}</li>
              </>
            )}
          </ul>
        </div>
        {"\n"}
      </div>
      {"\n"}
    </>
  );
}
